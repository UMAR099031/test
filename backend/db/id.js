const { nanoid } = require("nanoid");

function id(prefix) {
  return `${prefix}_${nanoid(12)}`;
}

module.exports = { id };

