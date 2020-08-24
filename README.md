# awsProxyGen

1. Make sure you have node js installed first

$ git clone https://github.com/jcbrian/awsProxyGen.git

$ cd awsProxyGen

$ npm install 


2.How to get required AWS credentials 
Sign up for AWS
Make sure AWS account is fully actiavted with a card attachted
These aren't free proxies
From the dashboard, click on username to actiavte dropdown, click Security Credentials
Click Access keys, click create Access Key and click show access key on the pop up

Open the config.json in your preffered way to edit code
update the secretAccessKey with your secret access key, same with accessKeyId

update quantitiy to desired amount of proxies (pretty sure you cant make a crazy amount with a basic aws account)

the region list is on line 5 to 14 on the aws.js file 

Some regions require further account validation for them to be utilized
(Paris)

after all that is done and you save the config file 



3.
$ node aws

the proxies will take around 2 minutes to generate, you can copy and paste them once they are printed in your terminal.
They should be active about a minute after they are prininted in your termial.


When you are done with them, You MUST delete them from your AWS dashboard.






 
