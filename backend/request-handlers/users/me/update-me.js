const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const { emailRegex, passwordRegex } = require("../../../utils/regexes");
const options = require("../../../config/options.json");
const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles the update of user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function updateMeHandler(req, res) {
  const { id: userId } = req.user;
  let { fullName, email, currentPassword, password: newPassword, passwordConfirmation: newPasswordConfirmation } = req.body;

  // 1. A password atual é OBRIGATÓRIA para qualquer alteração
  if (!currentPassword) {
    return res.status(400).json({ success: false, message: "A palavra-passe atual é obrigatória para guardar alterações." });
  }

  // 2. Verificar se há algo para atualizar
  if (!fullName && !email && !newPassword) {
    return res.status(400).json({ success: false, message: "Nenhum dado fornecido para atualização." });
  }

  // 3. Primeiro: Validar a Password Atual contra a BD
  const getUserSql = "SELECT password_hash FROM user WHERE id = ?";
  mysqlPool.query(getUserSql, [userId], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(500).json({ success: false, message: "Erro ao validar utilizador." });
    }

    const storedHash = rows[0].password_hash;
    bcrypt.compare(currentPassword, storedHash, (compareErr, isMatch) => {
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "A palavra-passe atual está incorreta." });
      }

      // Se chegamos aqui, a password está correta. Preparamos os campos.
      const updateFields = {};
      if (fullName) updateFields.full_name = fullName.trim();
      if (email) updateFields.email = email.trim();

      // 4. Lógica de Nova Password (se fornecida)
      if (newPassword) {
        if (newPassword === currentPassword) {
          return res.status(400).json({ success: false, message: "A nova password não pode ser igual à atual." });
        }
        if (newPassword !== newPasswordConfirmation) {
          return res.status(400).json({ success: false, message: "As passwords não coincidem." });
        }
        if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({ success: false, message: "Formato da nova password inválido." });
        }

        const saltRounds = options.auth.saltRounds;
        bcrypt.hash(newPassword, saltRounds, (hashErr, hashedPassword) => {
          if (hashErr) return res.status(500).json({ success: false, message: "Erro ao processar password." });

          updateFields.password_hash = hashedPassword;
          executeUpdate(updateFields, userId, res);
        });
      } else {
        // Atualiza apenas nome/email
        executeUpdate(updateFields, userId, res);
      }
    });
  });
}
module.exports.updateMeHandler = updateMeHandler;

/**
 * Helper function to execute the update query
 *
 * @param {Object} updateFields Object containing fields to update
 * @param {string|number} userId The ID of the user to update
 * @param {express.Response} res Express response object
 */
function executeUpdate(updateFields, userId, res) {
  // build dynamic SQL query
  const fields = Object.keys(updateFields);
  const values = Object.values(updateFields);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  // update user with dynamic fields
  const updateUserSql = mysql.format(
      `UPDATE user SET ${setClause} WHERE id = ?`,
      [...values, userId]
  );
  mysqlPool.query(updateUserSql, (err, rows) => {
    if (err) {
      console.error("Error updating user:", err);
      // check if error is due to duplicate email
      if (err.code === "ER_DUP_ENTRY") {
        return res
            .status(409)
            .json({ success: false, message: "Email already in use" });
      }
      return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
    }

    if (rows.affectedRows === 0) {
      return res
          .status(404)
          .json({ success: false, message: "User not found" });
    }

    return res
        .status(200)
        .json({ success: true, message: "User updated successfully" });
  });
}