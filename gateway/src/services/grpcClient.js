const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../../proto/block/block.proto');
const GRPC_ADDR = process.env.STAKEHOLDERS_GRPC_URL || 'stakeholders-service:4001';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,          // keep user_id as user_id
  longs: String,
  enums: String,           // enums come back as strings (fine)
  defaults: true,
  oneofs: true,
});

const blockProto = grpc.loadPackageDefinition(packageDefinition).block;

const client = new blockProto.BlockService(
  GRPC_ADDR,
  grpc.credentials.createInsecure()
);


module.exports = {
  UserRole: {
    USER_ROLE_UNSPECIFIED: 0,
    USER_ROLE_USER: 1,
    USER_ROLE_ADMIN: 2,
    USER_ROLE_GUIDE: 3,
  },

  /**
   * Call the BlockUser RPC
   * @param {number} role - enum value (1..3)
   * @param {string} userId
   * @returns {Promise<{message: string}>}
   */
  blockUser(role, userId) {
    return new Promise((resolve, reject) => {
      client.BlockUser(
        { role, user_id: userId },
        (err, resp) => {
          if (err) return reject(err);
          resolve(resp);
        }
      );
    });
  },
};
