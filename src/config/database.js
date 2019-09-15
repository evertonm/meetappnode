module.exports = {
  dialect: 'postgres',
  database: 'meetapp',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
