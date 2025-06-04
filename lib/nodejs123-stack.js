const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { Stack } = cdk;
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
      description: 'Allow HTTP traffic1',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    const userDataScript = ec2.UserData.forLinux();
    userDataScript.addCommands(
      fs.readFileSync(path.join(__dirname, '../setup.sh'), 'utf8')
    );

    const role = new iam.Role(this, 'CodeDeployEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2RoleforAWSCodeDeploy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    // Tạo Launch Template (có security group)
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `MyTemplate-${envName}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      userData: userDataScript,
      role: role,
    });

    // Tạo Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, `WebAppASG-${envName}`, {
      vpc,
      launchTemplate: lt,
      minCapacity: 2,
      maxCapacity: 4,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }  // 👈 thêm dòng này

    });

    // Tạo Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'WebALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: `WebAppALB-${envName}`
    });

    const listener = lb.addListener('Listener', {
      port: 80,
      open: true,
    });

    // Gán Auto Scaling Group làm target cho ALB
    listener.addTargets('AppFleet', {
      port: 80,
      targets: [asg],
    });

    // Output ALB DNS
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: lb.loadBalancerDnsName,
    });
  }
}

module.exports = { WebAppStack };