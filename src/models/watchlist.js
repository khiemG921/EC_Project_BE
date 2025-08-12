module.exports = (sequelize, DataTypes) => {
  const Watchlist = sequelize.define('Watchlist', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firebase_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'watchlist',
    timestamps: false
  });

  Watchlist.associate = (models) => {
    Watchlist.belongsTo(models.Service, {
      foreignKey: 'service_id',
      as: 'service'
    });
  };

  return Watchlist;
};