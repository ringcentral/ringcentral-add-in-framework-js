<% if (deployment === 'aws_lambda_and_dynamoDB') { %>
const Sequelize = require('dynamo-sequelize').default;

const config = {
  dialect: 'dynamo',
  define: {
    timestamps: true
  },
  logging: false,
  throughput: {
    read: process.env.DYNAMO_READ || 20,
    write: process.env.DYNAMO_WRITE || 10
  }
};

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  config
);

<%} else {%>
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions:{
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
);
<%}%> 

exports.sequelize = sequelize;