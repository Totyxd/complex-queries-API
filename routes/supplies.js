// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Supply , Classroom, sequelize, Student} = require('../db/models');
const { Op } = require('sequelize');

// List of supplies by category
router.get('/category/:categoryName', async (req, res, next) => {

        const supplies = await Supply.findAll({
            attributes: ["id", "name", "category", "handed"],
            where: {
                category: req.params.categoryName
            },
            order: [[Classroom, "name", "ASC"], ["name"]],
            include: {
                model: Classroom,
                attributes: ["id", "name"]
            }
        });

        res.json(supplies);
});


// Scissors Supply Calculation
router.get('/scissors/calculate', async (req, res, next) => {
    let result = {};

    const scissorsData = await Supply.findAll({
        attributes: ["handed",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {name: {[Op.like]: "%scissors%"}},
        group: ["handed"]
    });
    result.numLeftyScissors = scissorsData[0].getDataValue("count");
    result.numRightyScissors = scissorsData[1].getDataValue("count");
    result.totalNumScissors = result.numLeftyScissors + result.numRightyScissors;

    const lefties = await Classroom.count({
        include: {
            model: Student,
            attributes: [],
            through: {attributes: []},
            where: {leftHanded: true}
        },
    });
    const numOfStudents = await Classroom.count({
        include: {
            model: Student,
            attributes: [],
            through: {attributes: []},
        },
    });;
    result.numLeftHandedStudents = lefties;
    result.numRightHandedStudents = numOfStudents - result.numLeftHandedStudents;

    result.numRightyScissorsStillNeeded = result.numRightHandedStudents - result.numRightyScissors;
    result.numLeftyScissorsStillNeeded = result.numLeftHandedStudents - result.numLeftyScissors;

    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;
