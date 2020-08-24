const AWS = require('aws-sdk');
const { generateRandomId, sleep } = require('./helpers');
const { secretAccessKey, accessKeyId, quantity, region, proxyUsername, proxyPassword } = require('./config')
/*
REGIONS:
north virginia
north california
tokyo
frankfurt
sao paulo
ohio
mumbai
sydney
paris
*/
const awsLocations = {
    "north virginia": "us-east-1",
    "north california": "us-west-1",
    "tokyo": "ap-northeast-1",
    "frankfurt": "eu-central-1",
    "london": "eu-west-3",
    "sao paulo": "sa-east-1",
    "ohio": "us-east-2",
    "mumbai": "ap-south-1",
    "sydney": "ap-southeast-2",
    "canada": "ca-central-1",
    "paris": "eu-west-3"
}
const redHatAMIs = {
    "north virginia": "ami-098f16afa9edf40be",
    "north california": "ami-066df92ac6f03efca",
    "tokyo": "ami-07dd14faa8a17fb3e",
    "frankfurt": "ami-07dfba995513840b5",
    "london": "ami-0fc841be1f929d7d1",
    "sao paulo": "ami-00e63b4959e1a98b7",
    "ohio": "ami-0a54aef4ef3b5f881",
    "mumbai": "ami-052c08d70def0ac62",
    "sydney": "ami-0810abbfb78d37cdf",
    "canada": "ami-04312317b9c8c4b51",
    "paris": "ami-09e973def6bd1ad96"
}
/**
 * @constructor
 * @param {string} region - region where the proxy will be located
 * @param {string} secret - needed for AWS auth env var
 * @param {string} access - needed for AWS auth env var
 * 
 * */
class AWS_proxy {
    constructor(region, secret, access, proxyCount, proxyUsername, proxyPassword) {
        this.region = region
        this.proxyCount = proxyCount
        this.proxyUsername = proxyUsername
        this.proxyPassword = proxyPassword
        this.amiID = redHatAMIs[region]
        process.env["AWS_SECRET_ACCESS_KEY"] = secret
        process.env["AWS_ACCESS_KEY_ID"] = access
        AWS.config.update({ region: awsLocations[this.region] })
        this.ec2 = new AWS.EC2({ apiVersion: '2016-11-15' })

    }
    /**
     * @function createSecurityGroup | creates security group and applies rule to allow for websites to hit the proxy
     * @returns the security group ID
     */
    async createSecurityGroup() {
        const groupName = generateRandomId('group')
        let params = {
            Description: "Security Group for Proxies",
            GroupName: groupName
        }
        try {
            const { GroupId } = await this.ec2.createSecurityGroup(params).promise();
            try {
                let paramsForRule = {
                    GroupId: GroupId,
                    CidrIp: '0.0.0.0/0',
                    FromPort: -1,
                    IpProtocol: "-1",
                    ToPort: -1
                }
                await this.ec2.authorizeSecurityGroupIngress(paramsForRule).promise();
                return GroupId
            } catch (error) {
                console.log(error + "Error applying rule to group " + GroupId)
            }
        } catch (error) {
            console.log(error + "error creating secuirty group",)
        }

    }
    /**
     * @function
     * @name createStartUpScript | returns the start up script with desired username and password
     */
    createStartUpScript() {
        //big thanks to peter, https://github.com/dzt for most of the startup script
        return `#!/bin/bash 
        systemctl disable firewalld
        systemctl stop firewalld
         yum install squid wget iptables-services httpd-tools -y && 
        touch /etc/squid/passwd &&
        systemctl start iptables &&  systemctl enable iptables &&
        htpasswd -b /etc/squid/passwd ${this.proxyUsername} ${this.proxyPassword} &&
        wget -O /etc/squid/squid.conf https://raw.githubusercontent.com/dzt/easy-proxy/master/confg/userpass/squid.conf --no-check-certificate &&
        touch /etc/squid/blacklist.acl &&
        systemctl restart squid.service && systemctl enable squid.service &&
        iptables -I INPUT -p tcp --dport 3128 -j ACCEPT &&
        iptables-save`
    }
    /**
     * @function
     * @name generateKeyPair | Makes key pair so possible to create Instance
     */
    async generateKeyPair() {
        let keyPairName = generateRandomId('keyPair')
        let params = {
            KeyName: keyPairName
        }
        try {
            let data = await this.ec2.createKeyPair(params).promise()
            data = JSON.stringify(data)
            data = JSON.parse(data);
            return keyPairName
        } catch (error) {
            console.log(error + '\n Error making key Pair')
        }
    }

    /**
     * 
     * @function
     * @name arrayOfInstanceIds | searches for public IPs within the instanceIDs provided 
     * @param arrayOfInstanceIds | array of instance Ids
     */
    async grabPublicIPs(arrayOfInstanceIds) {
        let proxies
        let params = {
            InstanceIds: arrayOfInstanceIds
        }
        try {
            const instanceData = await this.ec2.describeInstances(params).promise()
            proxies = instanceData.Reservations[0].Instances.map(instance => {
                let proxy = ""
                proxy += instance.PublicIpAddress
                proxy += `:3128:${this.proxyUsername}:${this.proxyPassword}`
                return proxy
            })
            return proxies

        } catch (error) {
            console.log(error)
            console.log("There has been an error grabbing instance Public IPs")
        }
    }
    /**
   * @function 
   * @name init | Calls the neccesaray functions to create instance, creates instance
   */
    async init() {
        let instanceIds = []
        const instanceType = "t2.micro"
        let startupScript = this.createStartUpScript();
        startupScript = Buffer.from(startupScript).toString('base64')
        let securityGroupId = await this.createSecurityGroup();
        let keyPairName = await this.generateKeyPair()
        console.log("Success getting StartupScript, Security Group and KeyPair", "success")
        const instanceParams = {
            ImageId: this.amiID,
            InstanceType: instanceType,
            KeyName: keyPairName,
            MinCount: this.proxyCount,
            MaxCount: this.proxyCount,
            UserData: startupScript,
            SecurityGroupIds: [securityGroupId]
        }
        try {
            let instanceLaunch = await this.ec2.runInstances(instanceParams).promise()
            console.log("Success creating Instances", "success")
            
            instanceLaunch.Instances.forEach(instanceInfo => instanceIds.push(instanceInfo.InstanceId));
            await sleep(20)
            const proxies = await this.grabPublicIPs(instanceIds)
            await sleep(90)
            console.log(proxies.join('\n'))
        } catch (error) {
            console.log("Error creating Instances")
            console.log(error)
        }



    }

}

new AWS_proxy(region, secretAccessKey, accessKeyId, quantity, proxyUsername, proxyPassword).init()

