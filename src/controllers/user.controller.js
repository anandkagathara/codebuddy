const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersAggregate = [
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId', 
          as: 'posts',
        },
      },
      {
        $project: {
          name: 1,
          posts: { $size: '$posts' }, 
        },
      },
      {
        $facet: {
          metadata: [
            { $count: 'totalDocs' },
            { $addFields: { page, limit } },
          ],
          data: [
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
      {
        $unwind: '$metadata',
      },
      {
        $project: {
          totalDocs: '$metadata.totalDocs',
          limit: '$metadata.limit',
          page: '$metadata.page',
          totalPages: {
            $ceil: {
              $divide: ['$metadata.totalDocs', '$metadata.limit'],
            },
          },
          pagingCounter: { $add: [skip, 1] },
          hasPrevPage: { $gt: [page, 1] },
          hasNextPage: {
            $gt: ['$metadata.totalDocs', { $add: [skip, limit] }],
          },
          prevPage: { $cond: { if: { $gt: [page, 1] }, then: { $subtract: [page, 1] }, else: null } },
          nextPage: {
            $cond: {
              if: { $gt: ['$metadata.totalDocs', { $add: [skip, limit] }] },
              then: { $add: [page, 1] },
              else: null,
            },
          },
          data: 1,
        },
      },
    ];

    const result = await User.aggregate(usersAggregate);

    const response = {
      data: {
        users: result[0].data, 
        pagination: {
          totalDocs: result[0].totalDocs,
          limit: result[0].limit,
          page: result[0].page,
          totalPages: result[0].totalPages,
          pagingCounter: result[0].pagingCounter,
          hasPrevPage: result[0].hasPrevPage,
          hasNextPage: result[0].hasNextPage,
          prevPage: result[0].prevPage,
          nextPage: result[0].nextPage,
        },
      },
    };
    res.status(200).json(response);
  } catch (error) {
    res.send({ error: error.message });
  }
};
