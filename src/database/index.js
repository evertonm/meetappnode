import Sequelize from 'sequelize';

import File from '../app/models/File';
import Meetup from '../app/models/Meetup';
import Subscription from '../app/models/Subscription';
import User from '../app/models/User';

import databaseConfig from '../config/database';

const models = [User, File, Meetup, Subscription]; // Colocar todos models aqui.

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
