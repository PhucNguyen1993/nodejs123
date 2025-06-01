const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { Stack } = cdk;

class WebAppStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Tạo VPC
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      maxAzs: 2,
      natGateways: 0,
    });

    // Tạo Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'WebAppSG', {
      vpc,
      description: 'Allow HTTP traffic',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

const userDataScript = ec2.UserData.forLinux();
    userDataScript.addCommands(
  'sudo yum update -y',
  'sudo yum install -y httpd',
  'sudo systemctl start httpd',
  'sudo systemctl enable httpd',
  'echo "Hello from CDK EC2 Phuc Happy 1993 NewNewNewNew" | sudo tee /var/www/html/index.html'
);

    // Tạo Launch Template (có security group)
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      userData: userDataScript,
    });

    // Tạo Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
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
      loadBalancerName: 'WebAppALB',
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
