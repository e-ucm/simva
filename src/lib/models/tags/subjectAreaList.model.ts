import { Sequelize, Model } from "sequelize";

export class SubjectAreaList extends Model {
  declare subject_area_id: number;
  declare subject_area_name: string;
}

export function SubjectAreaListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SubjectAreaList.init({
    subject_area_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject_area_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SubjectAreaList",
    tableName: "Subject_area_list",
    timestamps: false,
  });

  return SubjectAreaList;
}