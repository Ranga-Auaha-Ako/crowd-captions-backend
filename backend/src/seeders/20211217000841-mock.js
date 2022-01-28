"use strict";

const { query } = require("express");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    for (let i = 0; i < 10; i++) {
      // Add 10 rows
      await queryInterface.bulkInsert(
        "CaptionFiles",
        [
          {
            lecture_id: i,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    for (let i = 0; i < 10; i++) {
      // Add 10 rows
      await queryInterface.bulkInsert(
        "courses",
        [
          {
            courseId: i,
            courseName: "course name" + i,
            timePeriod: "2022 summer school",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        await queryInterface.bulkInsert(
          "CaptionSentences",
          [
            {
              id: i * 10 + j,
              position: j,
              start: new Date().getTime(),
              body: `This is a test string ${i}`,
              CaptionFileLectureId: i,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          {}
        );
      }
    }

    for (let i = 0; i < 10; i++) {
      await queryInterface.bulkInsert(
        "Users",
        [
          {
            access: i % 3,
            email: `abc123${i}@aucklanduni.ac.nz`,
            username: "abc123" + i,
            name: "Test User " + i,
            upi: "abc123" + i,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    for (let x = 0; x < 20; x++)
      for (let i = 0; i < 10; i++) {
        await queryInterface.bulkInsert(
          "Edits",
          [
            {
              id: x * 10 + i,
              body: `This is a test body ${x * 10 + i}`,
              approved: false,
              blocked: false,
              CaptionSentenceId: x,
              UserUpi: "abc1231",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          {}
        );
      }

    for (let i = 0; i < 10; i++) {
      await queryInterface.bulkInsert("Votes", [
        {
          id: i,
          upvoted: Math.random() < 0.5,
          EditId: i,
          UserUpi: "abc1231",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    for (let i = 0; i < 200; i++) {
      await queryInterface.bulkInsert("Reports", [
        {
          id: i,
          EditId: i,
          UserUpi: "abc1231",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    for (let i = 0; i < 10; i++) {
      await queryInterface.bulkInsert("courseOwnerships", [
        {
          CaptionFileLectureId: i,
          UserUpi: "abc123" + i,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("courseOwnerships", null, {});
    await queryInterface.bulkDelete("courses", null, {});
    await queryInterface.bulkDelete("CaptionFiles", null, {});
    await queryInterface.bulkDelete("CaptionSentences", null, {});
    await queryInterface.bulkDelete("Edits", null, {});
    await queryInterface.bulkDelete("Votes", null, {});
    await queryInterface.bulkDelete("Reports", null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
