const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { Stack, Duration } = cdk;
const fs = require('fs');
const path = require('path');
const iam = require('aws-cdk-lib/aws-iam');

class WebAppStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { envName } = props;

    // Tạo VPC
    const vpc = new ec2.Vpc(this, `WebAppVPC-${envName}`, {
      maxAzs: 2,
      natGateways: 0,
    });

    // Tạo Security Group
    const securityGroup = new ec2.SecurityGroup(this, `WebAppSG-${envName}`, {
      vpc,
      description: 'Allow HTTP traffic',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    // User data script
    const userDataScript = ec2.UserData.forLinux();
    userDataScript.addCommands(
      fs.readFileSync(path.join(__dirname, '../setup.sh'), 'utf8')
    );

    // IAM Role cho EC2
//    const role = new iam.Role(this, 'CodeDeployEC2Role', {
//      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
//      managedPolicies: [
//        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2RoleforAWSCodeDeploy'),
//        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
//      ],
//    });

    // Tạo Launch Template
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `MyTemplate-${envName}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      userData: userDataScript,
   //   role: role,
    });

    // Tạo Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, `WebAppASG-${envName}`, {
      vpc,
      launchTemplate: lt,
      minCapacity: 1,
      maxCapacity: 4,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Tạo Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'WebALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: `WebAppALB-${envName}`,
    });

    // Tạo Target Group, gán ASG làm target (cũng có thể thêm instance nếu muốn)
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'MyTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        path: '/',
        interval: Duration.seconds(30),
      },
    });

    // Tạo Listener và gán Target Group mặc định
    lb.addListener('Listener', {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup],
    });

    // Output DNS của Load Balancer
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: lb.loadBalancerDnsName,
    });
  }
}

module.exports = { WebAppStack };