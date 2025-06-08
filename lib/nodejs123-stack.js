const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
//const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const lambdaEventSource = require('aws-cdk-lib/aws-lambda-event-sources');
const s3 = require('aws-cdk-lib/aws-s3');
const { Stack, Duration } = cdk;
const fs = require('fs');
const path = require('path');
const apigateway = require('aws-cdk-lib/aws-apigateway');


class WebAppStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { envName } = props;

//    // Tạo VPC
//    const vpc = new ec2.Vpc(this, `WebAppVPC-${envName}`, {
//      maxAzs: 2,
//      natGateways: 0,
//    });
//
//    // Tạo Security Group
//    const securityGroup = new ec2.SecurityGroup(this, `WebAppSG-${envName}`, {
//      vpc,
//      description: 'Allow HTTP traffic',
//      allowAllOutbound: true,
//    });
//
//    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
//    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
//
//    // User data script
//    const userDataScript = ec2.UserData.forLinux();
//    userDataScript.addCommands(
//      fs.readFileSync(path.join(__dirname, '../setup.sh'), 'utf8')
//    );
//
//    // Tạo Launch Template
//    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
//      launchTemplateName: `MyTemplate-${envName}`,
//      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
//      machineImage: ec2.MachineImage.latestAmazonLinux2(),
//      securityGroup: securityGroup,
//      userData: userDataScript,
//    });
//
//    // Tạo Auto Scaling Group
//    const asg = new autoscaling.AutoScalingGroup(this, `WebAppASG-${envName}`, {
//      vpc,
//      launchTemplate: lt,
//      minCapacity: 1,
//      maxCapacity: 4,
//      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
//    });
//
//    asg.scaleOnCpuUtilization('CpuScaling', {
//      targetUtilizationPercent: 40,
//      cooldown: Duration.seconds(300),
//      estimatedInstanceWarmup: Duration.seconds(300),
//    });
//
//    // Tạo Load Balancer
//    const lb = new elbv2.ApplicationLoadBalancer(this, 'WebALB', {
//      vpc,
//      internetFacing: true,
//      loadBalancerName: `WebAppALB-${envName}`,
//    });
//
//    // Tạo Target Group
//    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'MyTargetGroup', {
//      vpc,
//      port: 80,
//      protocol: elbv2.ApplicationProtocol.HTTP,
//      targets: [asg],
//      healthCheck: {
//        path: '/',
//        interval: Duration.seconds(30),
//      },
//    });
//
//    // Tạo Listener và gán Target Group mặc định
//    lb.addListener('Listener', {
//      port: 80,
//      open: true,
//      defaultTargetGroups: [targetGroup],
//    });
//
//    // Output DNS của Load Balancer
//    new cdk.CfnOutput(this, 'ALBDNS', {
//      value: lb.loadBalancerDnsName,
//    });

    // --- BẮT ĐẦU PHẦN LAMBDA + S3 ---

//    // Tạo S3 bucket (hoặc lấy bucket có sẵn)
//    const bucket = s3.Bucket.fromBucketName(this, 'ExistingBucket', 'newbucket-upload-donthuoc');
//
//    // Tạo role cho Lambda
//    const role = new iam.Role(this, 'LambdaExecutionRole', {
//      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
//    });
//    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
//    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTextractFullAccess'));
//
//
//    // Cấp quyền Lambda đọc bucket
//    bucket.grantRead(role);
//
//    // Tạo Lambda function Node.js
//    const lambdaFn = new lambda.Function(this, 'cdk-rekn-function', {
//      code: lambda.Code.fromAsset('lambda'),
//      runtime: lambda.Runtime.PYTHON_3_12,
//      handler: 'index.lambda_handler',
//      role: role,
//      environment: {
//        BUCKET: bucket.bucketName,
//      },
//    });
//
//    // Thêm trigger S3 ObjectCreated
//    lambdaFn.addEventSource(
//      new lambdaEventSource.S3EventSource(bucket, {
//        events: [s3.EventType.OBJECT_CREATED],
//      })
//    );

        // Tạo role cho Lambda
        const role = new iam.Role(this, 'LambdaExecutionRole', {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));


        const createPatientFn = new lambda.Function(this, 'CreatePatientFunction', {
          code: lambda.Code.fromAsset('lambda'),
          runtime: lambda.Runtime.PYTHON_3_12,
          handler: 'createPatient.handler',
          role: role,
        });

        const api = new apigateway.RestApi(this, 'HospitalApi', {
          restApiName: 'Hospital Service',
          description: 'API cho hệ thống quản lý bệnh nhân.',
        });

       // Resource /patients
       const patients = api.root.addResource('patients');

       // Method POST tích hợp Lambda
       patients.addMethod('POST', new apigateway.LambdaIntegration(createPatientFn));



  }
}

module.exports = { WebAppStack };
