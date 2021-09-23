const Sequelize = require('dynamo-sequelize').default;

const config = {
  define: {
    timestamps: true
  },
  logging: false,
  throughput: {
    read: process.env.DYNAMO_READ || 20,
    write: process.env.DYNAMO_WRITE || 10
  }
};

if (process.env.DIALECT === 'dynamodb') {
  config.dialect = 'dynamo';
}

const sequelize = new Sequelize(
  process.env.DATABASE_CONNECTION_URI,
  config
);

exports.sequelize = sequelize;
