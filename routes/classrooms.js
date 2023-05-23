// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom , StudentClassroom, Supply, Student, sequelize} = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {

    const where = {};
    if (req.query.name && typeof req.query.name === "string") {
        where.name = {[Op.like]: `%${req.query.name}%`};
    };

    if (req.query.studentLimit) {
        if (req.query.studentLimit.includes(",")) {
            const minMax = req.query.studentLimit.split(",");
            if (!isNaN(minMax[0]) && !isNaN(minMax[1]) && minMax[1] > minMax[0] && minMax.length === 2) {
                where.studentLimit = {[Op.and]: [{[Op.gte]: parseInt(minMax[0])}, {[Op.lte]: parseInt(minMax[1])}]}
            } else {
                return next({
                    message: "Student Limit should be two numbers: min,max"
                });
            };
        } else {
            if (!isNaN(req.query.studentLimit)) {
                where.studentLimit = req.query.studentLimit;
            } else {
                return next({
                    message: "Student Limit should be an integer"
                });
            };
        };
    };

    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit', [sequelize.fn("AVG", sequelize.col("StudentClassrooms.grade")), "avgGrade"], [sequelize.fn("COUNT", sequelize.col("StudentClassrooms.studentId")), "numOfStudents"]],
        order: [["name"]],
        where,
        include: {
            model: StudentClassroom,
            attributes: []
        },
        group: ['Classroom.id']
    });

    res.json(classrooms);
});


// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        include: [
            {
                model: Supply,
                attributes: ["id", "name", "category"],
            },
            {
                model: Student,
                attributes: ["id", "firstName", "lastName"],
                through: {attributes: []},
            }
        ],
        order: [
            [Supply, "category", "ASC"], // Ordenar por el atributo "category" de Supply
            [Supply, "name", "ASC"], // Ordenar por el atributo "name" de Supply
            [Student, "lastName", "ASC"], // Ordenar por el atributo "lastName" de Student
            [Student, "firstName", "ASC"], // Ordenar por el atributo "firstName" de Student
        ]
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    const supplyCount = await classroom.getSupplies();
    classroom.setDataValue("supplyCount", supplyCount.length);
    const studentCount = await classroom.getStudents();
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
