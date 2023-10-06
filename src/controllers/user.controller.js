const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const usersAggregate = [
      {
        $match: {},
      },
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
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const users = await User.aggregate(usersAggregate);
    const totalDocs = await User.countDocuments();
    const totalPages = Math.ceil(totalDocs / limit);
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    const response = {
      data: {
        users,
        pagination: {
          totalDocs,
          limit,
          page,
          totalPages,
          pagingCounter: skip + 1,
          hasPrevPage,
          hasNextPage,
          prevPage: hasPrevPage ? page - 1 : null,
          nextPage: hasNextPage ? page + 1 : null,
        },
      },
    };
    res.status(200).json(response);
  } catch (error) {
    res.send({ error: error.message });
  }
};

