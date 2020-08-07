// grpc api reference https://grpc.io/docs/languages/node/basics/
// The package @grpc/grpc-js can also be used instead of grpc here
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
  __dirname + '/calculator.proto',
  {keepCase: true,
   longs: String,
   enums: String,
   defaults: true,
   oneofs: true
  });
const calculatorProto = grpc.loadPackageDefinition(packageDefinition);

const PORT = process.env.PORT;

function calculate(call, callback) {
  const request = call.request;
  let result;
  if (request.operation === 'ADD') {
    result = request.first_operand + request.second_operand;
  } else {
    result = request.first_operand - request.second_operand;
  }
  callback(null, {result});
}
function sum(call, callback) {
  let result = 0;
  call.on('data', function(num) {
    result += num.value;
  })
  call.on('end', function() {
    callback(null, {result});
  })
}

function sumRunning(call, callback) {
  let result = 0;
  call.on('data', function(num) {
    result += num.value;
    call.write({ result });
  })
  call.on('end', function() {
    call.write({ result });
    call.end();
  })
}

function fibonacci(call) {
  const request = call.request;
  const count = request.value;
  let state = [0, 1];
  for(let i=0;i<count;++i) {
    call.write({ result: state[1] })
    state = [state[1], state[0] + state[1]];
  }
  call.end();
}

function main() {
  const server = new grpc.Server();
  server.addService(calculatorProto.Calculator.service, {calculate, sum, fibonacci, sumRunning});
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      throw error;
    }
    server.start();
  });
}

main();