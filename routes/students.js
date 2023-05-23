// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Student, Classroom, StudentClassroom, sequelize } = require('../db/models');
const { Op } = require("sequelize");

// List
router.get('/', async (req, res, next) => {
    let size;
    let page;
    try {
        size = Number(req.query.size);
        page = Number(req.query.page);
    } catch (err) {
        errorResult.errors.push("Invalid input for page or size. Check the query params");
        res.status(400).json(errorResult);
    };
    const limit = typeof size === "number" && size > 0 && size < 200 ? size : 10;
    const offset =  typeof page === "number" && page > 0 ? ((page || 1) - 1) * limit : 0;

    const where = {};
    if (req.query.firstName && typeof req.query.firstName === "string") {
        where.firstName = {[Op.like]: `%${req.query.firstName}%`};
    };
    if (req.query.lastName && typeof req.query.lastName === "string") {
        where.lastName = {[Op.like]: `%${req.query.lastName}%`};
    };
    if (req.query.leftHanded && req.query.leftHanded === "true" || req.query.leftHanded === "false") {
        where.leftHanded = req.query.leftHanded === "true" ? true : false;
    };

    let result = {};
    result.rows = await Student.findAll({
        attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
        order: [["lastName"], ["firstName"]],
        limit,
        offset,
        where,
        include: {
            model: Classroom,
            attributes: ["id", "name"],
            through: {attributes: ["grade"]},
        }
    });

    result.page = offset / limit + 1 || 1;
    const count = await Student.findAll({
        where,
        attributes: [
            [sequelize.fn("COUNT", sequelize.col("id")), "count" ]
        ],
        raw: true
    });
    result.count = count[0].count;
    result.numOfPages = Math.ceil(result.count / limit);
    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;
