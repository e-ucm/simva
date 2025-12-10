module.exports = {
  apps: [
    {
      name: "main-app",
      script: "src/bin/www",
      watch: process.env.NODE_ENV === "development",
      node_args: process.env.NODE_ENV === "development"
        ? ( process.env.PROFILING === "true"
          ? "--inspect=0.0.0.0:9229 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
          "--inspect=0.0.0.0:9229 --trace-warnings")
        : "",
      restart_delay: 5000,
      env: {
        ENABLE_TASK_CONSUMER: "false",
        PROCESS_TAG: "[MAIN]"
      }
    },
    {
      name: "process-kafka-queue",
      script: "src/bin/kafka-queue.js",
      watch: process.env.NODE_ENV === "development",
      node_args: process.env.NODE_ENV === "development"
        ? ( process.env.PROFILING === "true"
          ? "--inspect=0.0.0.0:9230 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
          "--inspect=0.0.0.0:9230 --trace-warnings")
        : "",
      restart_delay: 5000,
      env: {
        ENABLE_TASK_CONSUMER: "true",
        PROCESS_TAG: "[KAFKA]"
      }
    }
  ]
};
