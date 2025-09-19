const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../../proto/tours/tours.proto');
const GRPC_ADDR = process.env.TOURS_GRPC_URL || 'tours-service:5001'; // Nova porta za gRPC

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const toursProto = grpc.loadPackageDefinition(packageDefinition).tours;

const client = new toursProto.ToursService(
  GRPC_ADDR,
  grpc.credentials.createInsecure()
);

module.exports = {
  /**
   * Get all tours via gRPC
   * @returns {Promise<{tours: Array, total_count: number, success: boolean, message: string}>}
   */
  getTours() {
    return new Promise((resolve, reject) => {
      // Prazan request objekat pošto ne šaljemo parametre
      client.GetTours({}, (err, response) => {
        if (err) {
          console.error('gRPC GetTours error:', err);
          return reject(err);
        }
        resolve(response);
      });
    });
  },
};