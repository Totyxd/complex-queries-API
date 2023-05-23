// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom , StudentClassroom, sequelize} = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    // Your code here

    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit' ],
        order: [["name"]]
        // Phase 1B: Order the Classroom search results
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        // Your code here
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    const supplyCount = await classroom.getSupplies();
    classroom.setDataValue("supplyCount", supplyCount.length);
    const studentCount = await classroom.getStudents();
    console.log(studentCount);
    classroom.setDataValue("studentCount", studentCount.length);
    classroom.setDataValue("overloaded", classroom.getDataValue("studentCount") > classroom.getDataValue("studentLimit") ? true : false);
    const avgGrade = await StudentClassroom.findAll({
        attributes: [
            [sequelize.fn("AVG", sequelize.col("grade")), "avgGrade"]
        ],
        where: {
            classroomId: req.params.id
        },
        raw: true
    });
    classroom.setDataValue("avgGrade", avgGrade[0].avgGrade);

    res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;
