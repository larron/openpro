export const issueResolvers = {
  tags: async (parent, args, { db }) => {
    const issueTags = await db.sequelize.models.IssueTag.findAll({ where: { issueId: parent.id } });

    return await db.sequelize.models.ProjectTag.findAll({
      where: { id: issueTags.map((issueTag) => issueTag.projectTagId) },
    });
  },
  comments: (parent, args, { db }) => {
    return db.sequelize.models.IssueComment.findAll(
      { where: { issueId: parent.id } },
      { order: [['createdAt', 'DESC']] }
    );
  },
  status: (parent, args, { db }) => {
    return db.sequelize.models.IssueStatuses.findByPk(parent.issueStatusId);
  },
  reporter: (parent, args, { db }) => {
    return db.sequelize.models.User.findByPk(parent.reporterId);
  },
  assignee: (parent, args, { db }) => {
    return db.sequelize.models.User.findByPk(parent.assigneeId);
  },
};
