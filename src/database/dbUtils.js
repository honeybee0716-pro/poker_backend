"use strict";

// Imports
const Sequelize = require("sequelize");
const { player } = require("../../config");
const { generateHash, validPassword } = require("../utils");
const Op = Sequelize.Op;

/**
 * Create new user if not exists
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} password
 * @param {String} email
 * @returns {Promise<any>}
 * @constructor
 */

function CreateUserAccountPromise(sequelizeObjects, user) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { [Op.or]: [{ name: user.name }, { email: user.email }] },
    })
      .then((userObj) => {
        if (userObj.length > 0) {
          const exists = userObj[0];
          resolve({
            result: false,
            user: userObj,
            error: `${
              exists.name === username ? "User name" : "Email address"
            } in use`,
          });
        } else {
          sequelizeObjects.User.create({
            ...user,
            password: generateHash(user.password),
          }).then(() => {
            resolve({ result: true });
          });
        }
      })
      .catch((err) => {
        console.error(`CreateUserAccountPromise ~ : ${err}`);
      });
  });
}

exports.CreateUserAccountPromise = CreateUserAccountPromise;

// function CreateAccountPromise(
//   sequelizeObjects,
//   username,
//   email,
//   agent_code,
//   password
// ) {
//   return new Promise(function (resolve, reject) {
//     sequelizeObjects.User.findAll({
//       limit: 1,
//       where: { [Op.or]: [{ name: username }, { email }] },
//     }).then((userObj) => {
//       if (userObj.length > 0) {
//         const exists = userObj[0];
//         resolve({
//           result: false,
//           error: `${
//             exists.name === username ? "User name" : "Email address"
//           } in use`,
//         });
//       } else {
//         sequelizeObjects.User.findAll({
//           limit: 1,
//           where: { id: agent_code },
//         }).then((agentObj) => {
//           if (!agentObj.length) {
//             resolve({ result: false, error: `Agent not found` });
//           } else {
//             sequelizeObjects.User.create({
//               name: username,
//               password: generateHash(password),
//               email: email,
//               agent_code,
//               money: player.regMoney,
//               role_id: 6,
//             }).then((user) => {
//               resolve({ result: true, user });
//             });
//           }
//         });
//       }
//     });
//   });
// }

function CreateAccountPromise(sequelizeObjects, username, email, agent_code, password) {
  return new Promise(function (resolve, reject) {
    // Check if username or email already exists
    sequelizeObjects.User.findOne({
      where: {
        [Op.or]: [
          { name: username },
          { email: email }
        ]
      }
    }).then((userObj) => {
      if (userObj) {
        // User with the same username or email already exists
        resolve({
          result: false,
          error: `${userObj.name === username ? "User name" : "Email address"} in use`,
        });
      } else {
        // Check if agent exists
        sequelizeObjects.User.findOne({
          where: { id: agent_code }
        }).then((agentObj) => {
          if (!agentObj) {
            // Agent not found
            resolve({ result: false, error: `Agent not found` });
          } else {
            // Create the new user
            sequelizeObjects.User.create({
              name: username,
              password: generateHash(password),
              email: email,
              agent_code,
              money: 0, // Assuming a default value for money
              role_id: 6, // Assuming a default role_id
            }).then((newUser) => {
              resolve({ result: true, user: newUser });
            }).catch((error) => {
              reject({ result: false, error: `Failed to create user: ${error.message}` });
            });
          }
        }).catch((error) => {
          reject({ result: false, error: `Failed to check agent: ${error.message}` });
        });
      }
    }).catch((error) => {
      reject({ result: false, error: `Failed to check user: ${error.message}` });
    });
  });
}

exports.CreateAccountPromise = CreateAccountPromise;

/**
 * Find user for login
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} password
 * @returns {Promise<any>}
 * @constructor
 */
function LoginPromise(sequelizeObjects, username, password, type) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { [Op.or]: [{ name: username }, { email: username }] },
      include: [
        {
          model: sequelizeObjects.Role,
          as: "role",
          attributes: ["id", "parent_id", "label", "fee", "type"],
        },
      ],
    }).then((users) => {
      if (users.length > 0) {
        const user = users[0];
        if (!user.status)
          resolve({
            result: false,
            error: `Your account was blocked. Please contact to support team`,
          });
        if (user.login_status)
        resolve({
          result: false,
          error: `Your account is already logged in.`,
          });
        if (type === "player" && user.role.type !== "player")
          resolve({ result: false, error: `Agents can't login` });
        if (type === "admin" && user.role.type === "player")
          resolve({ result: false, error: `Players can't login` });
        const check = validPassword(password, user.password);
        if (!check) resolve({ result: false, error: "Password is not match" });
        
        user
            .update({ login_status: true })
            .then(() => {
              resolve({ result: true, user });
            })
            .catch((error) => {
              reject(error);
            });

      } else {
        resolve({ result: false, error: "User not found" });
      }
    });
  });
}

exports.LoginPromise = LoginPromise;

/**
 * Logout user
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @returns {Promise<any>}
 * @constructor
 */
function LogoutPromise(sequelizeObjects, username) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findOne({
      where: { [Op.or]: [{ name: username }, { email: username }] },
    })
      .then((user) => {
        if (!user) {
          resolve({ result: false, error: 'User not found' });
        } else {
          user
            .update({ login_status: false })
            .then(() => {
              resolve({ result: true });
            })
            .catch((error) => {
              reject(error);
            });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

exports.LogoutPromise = LogoutPromise;

/**
 * Updates user money in the database
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {Number} amount
 * @returns {Promise<any>}
 * @constructor
 */
function SetbalancePromise(sequelizeObjects, username, amount) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findOne({
      where: { [Op.or]: [{ name: username }, { email: username }] },
    })
      .then((user) => {
        if (!user) {
          resolve({ result: false, error: 'User not found' });
        } else {
          const currentAmount = user.money;
          user
            .update({ money: currentAmount - amount })
            .then(() => {
              resolve({ result: true });
            })
            .catch((error) => {
              reject(error);
            });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
exports.SetbalancePromise = SetbalancePromise;

/**
 * Gets user parameters to user object
 * @param {Object} sequelizeObjects
 * @param {Number} playerId
 * @returns {Promise<any>}
 * @constructor
 */
function GetPlayerPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((users) => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          xp: users[0].xp,
          password: users[0].password,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count,
          player_role: users[0].player_role,
        });
      } else {
        resolve({
          result: false,
          id: null,
          name: null,
          money: null,
          win_count: null,
          lose_count: null,
          player_role: null,
        });
      }
    });
  });
}
exports.GetPlayerPromise = GetPlayerPromise;

/**
 * Gets user parameters to user object
 * @param {Object} sequelizeObjects
 * @param {String} username
 * @param {String} password
 * @returns {Promise<any>}
 * @constructor
 */
function GetLoggedInUserParametersPromise(
  sequelizeObjects,
  username,
  password
) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { name: username, password: password },
    }).then((users) => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count,
        });
      } else {
        resolve({
          result: false,
          id: null,
          name: null,
          money: null,
          win_count: null,
          lose_count: null,
        });
      }
    });
  });
}

exports.GetLoggedInUserParametersPromise = GetLoggedInUserParametersPromise;

/**
 * Update player name
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {String} newName
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerNamePromise(sequelizeObjects, userId, newName) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((obj) => {
      if (obj.length > 0) {
        obj[0].update({ name: newName }).then(() => {
          resolve({ result: true });
        });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.UpdatePlayerNamePromise = UpdatePlayerNamePromise;

/**
 * Update player current funds/money
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {Number} money
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerMoneyPromise(sequelizeObjects, userId, amount) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((obj) => {
      if (obj.length > 0) {
        obj[0].update({ money: obj[0].money + amount }).then(() => {
          resolve({ result: true });
        });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.UpdatePlayerMoneyPromise = UpdatePlayerMoneyPromise;

/**
 * Increment player win count
 * notice that this also needs event emitter for front end notification
 * @param {Object} sequelizeObjects
 * @param {Object} eventEmitter
 * @param {Number} connectionId
 * @param {Number} userId
 * @param {Boolean} isWinStreak
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerWinCountPromise(
  sequelizeObjects,
  eventEmitter,
  connectionId,
  userId,
  isWinStreak
) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((obj) => {
      if (obj.length > 0) {
        const incrementXp = isWinStreak ? 200 : 100;
        obj[0]
          .update({
            win_count: obj[0].win_count + 1,
            xp: obj[0].xp + incrementXp,
          })
          .then(() => {
            resolve({ result: true });
          })
          .then(() => {
            eventEmitter.emit(
              "onXPGained",
              connectionId,
              incrementXp,
              "you won the round." +
                (isWinStreak === true ? " (Win streak bonus)" : "")
            );
            resolve({ result: true });
          });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.UpdatePlayerWinCountPromise = UpdatePlayerWinCountPromise;

/**
 * Decrement player win count
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerLoseCountPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((obj) => {
      if (obj.length > 0) {
        obj[0].update({ lose_count: obj[0].lose_count + 1 }).then(() => {
          resolve({ result: true });
        });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.UpdatePlayerLoseCountPromise = UpdatePlayerLoseCountPromise;

/**
 * Insert statistic line for own dedicated table
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @param {Number} money
 * @param {Number} win_count
 * @param {Number} lose_count
 * @returns {Promise<any>}
 * @constructor
 */
function InsertPlayerStatisticPromise(
  sequelizeObjects,
  userId,
  money,
  win_count,
  lose_count
) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Statistic.create({
      user_id: userId,
      money: money,
      win_count: win_count,
      lose_count: lose_count,
    })
      .then(() => {
        resolve({ result: true });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

exports.InsertPlayerStatisticPromise = InsertPlayerStatisticPromise;

/**
 * User saw rewarding ad, increment money, ad count, xp
 * TODO: Needs validation implementation, user can call this method as cheat without checks for validity
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function UpdatePlayerRewardingAdShownPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((obj) => {
      if (obj.length > 0) {
        obj[0]
          .update({
            money: Number(obj[0].money) + 2000, // Increment money
            rew_ad_count: Number(obj[0].rew_ad_count) + 1,
            xp: Number(obj[0].xp) + 100, // Increment xp
          })
          .then(() => {
            resolve({ result: true });
          });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.UpdatePlayerRewardingAdShownPromise =
  UpdatePlayerRewardingAdShownPromise;

/**
 * Get user statistics for front end ui
 * or any other use case
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function GetLoggedInUserStatisticsPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: userId },
    }).then((users) => {
      if (users.length > 0) {
        resolve({
          result: true,
          id: users[0].id,
          name: users[0].name,
          money: users[0].money,
          role_id: users[0].role_id,
          win_count: users[0].win_count,
          lose_count: users[0].lose_count,
          xp: users[0].xp,
        });
      } else {
        resolve({
          result: false,
          id: null,
          name: null,
          money: null,
          role_id: null,
          win_count: null,
          lose_count: null,
          xp: null,
        });
      }
    });
  });
}

exports.GetLoggedInUserStatisticsPromise = GetLoggedInUserStatisticsPromise;

/**
 * Get all user ranks for viewing purposes
 * limited by 50 results, order by xp desc
 * @param {Object} sequelizeObjects
 * @returns {Promise<any>}
 * @constructor
 */
function GetRankingsPromise(sequelizeObjects) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.User.findAll({
      raw: true, // raw array of results
      limit: 50,
      attributes: ["name", "xp", "win_count", "lose_count"],
      // where: {id: {[Op.notIn]: [1, 2, 3]}},
      order: [["xp", "DESC"]],
    }).then((userObj) => {
      if (userObj.length > 0) {
        resolve({ result: true, ranks: userObj });
      } else {
        resolve({ result: false });
      }
    });
  });
}

exports.GetRankingsPromise = GetRankingsPromise;

/**
 * Get player chart statistic data for chart viewing
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function GetPlayerChartDataPromise(sequelizeObjects, userId) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Statistic.findAll({
      raw: true, // raw array of results
      limit: 150,
      attributes: ["money", "win_count", "lose_count"],
      where: { user_id: userId },
      order: [["id", "DESC"]],
    }).then((ranks) => {
      if (ranks.length > 0) {
        // select result must be reversed but not by id asc, that causes old data,
        // desc brings new data but in wrong order .reverse() array fixes this
        resolve({ result: true, ranks: ranks.reverse() });
      } else {
        resolve({ result: false, ranks: [] });
      }
    });
  });
}

exports.GetPlayerChartDataPromise = GetPlayerChartDataPromise;

/**
 * Get player chart statistic data for chart viewing
 * @param {Object} sequelizeObjects
 * @param {Number} userId
 * @returns {Promise<any>}
 * @constructor
 */
function SetChargingPromise(sequelizeObjects, playerId, amount) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Charge.findAll({
      where: { user_id: playerId, status: 0 },
    }).then((userObj) => {
      if (userObj.length >= 3) {
        resolve({
          result: false,
          error: `You've already requested it more than 3 times. Please wait`,
        });
      } else {
        sequelizeObjects.Charge.create({
          user_id: playerId,
          amount,
          status: false,
        }).then(() => {
          resolve({ result: true });
        });
      }
    });
  });
}

exports.SetChargingPromise = SetChargingPromise;

function CreateRolePromise(sequelizeObjects, param) {
  return new Promise(function (resolve, reject) {
    sequelizeObjects.Role.findAll({
      limit: 1,
      where: { label: param.label },
    })
      .then((roleObj) => {
        if (roleObj.length > 0) {
          const exists = roleObj[0];
          resolve({
            result: false,
            role: exists,
            error: `Role is already exists`,
          });
        } else {
          sequelizeObjects.Role.create(param).then(() => {
            resolve({ result: true });
          });
        }
      })
      .catch((err) => {
        console.error(`CreateRolePromise ~ : ${err}`);
      });
  });
}

exports.CreateRolePromise = CreateRolePromise;

function RecordUserAction(sequelizeObjects, player, action, amount = 0) {
  const { playerDatabaseId, playerMoney, playerCards } = player;
  return new Promise(function (resolve) {
    sequelizeObjects.Record.create({
      user_id: playerDatabaseId,
      current_money: playerMoney,
      player_cards: JSON.stringify(playerCards),
      action,
      amount,
    })
      .then((roleObj) => {
        resolve({ result: true });
      })
      .catch((err) => {
        console.error(`RecordUserAction ~ : ${err}`);
        resolve({ result: false });
      });
  });
}

exports.RecordUserAction = RecordUserAction;

async function SetAgentFee(sequelizeObjects, playerId, amount) {
  try {
    const userObj = await sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: playerId },
      include: [
        {
          model: sequelizeObjects.Role,
          as: "role",
          attributes: ["id", "parent_id", "label", "fee", "type"],
        },
      ],
    });

    if (!userObj.length) return { result: false, error: `user not exsits` };

    const user = userObj[0];
    if (user.role.type !== "agent")
      return { result: false, error: `not agent` };
    const fee = Number(
      ((Number(amount) * Number(user.role.fee)) / 100).toFixed(2)
    );

    await user.increment("money", {
      by: fee,
    });

    if (user.role.agent_code !== 1) {
      SetAgentFee(sequelizeObjects, user.agent_code, amount);
    }
    return { result: true };
  } catch (error) {
    console.error(`~~~ SetAgentFee ~ : ${err}`);
    return { result: false, error: `Internal server error` };
  }
}

function SplitAgentFee(sequelizeObjects, playerId, amount) {
  return new Promise(function (resolve) {
    sequelizeObjects.User.findAll({
      limit: 1,
      where: { id: playerId },
      include: [
        {
          model: sequelizeObjects.Role,
          as: "role",
          attributes: ["id", "parent_id", "label", "fee", "type"],
        },
      ],
    })
      .then((userObj) => {
        if (!userObj.length) {
          resolve({ result: false, error: `user not exsits` });
        } else {
          const user = userObj[0];
          if (user.role.type !== "player") return;
          SetAgentFee(sequelizeObjects, user.agent_code, amount);
        }
      })
      .catch((err) => {
        console.error(`CreateUserAccountPromise ~ : ${err}`);
      });
  });
}

exports.SplitAgentFee = SplitAgentFee;
