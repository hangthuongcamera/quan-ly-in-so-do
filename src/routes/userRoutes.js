const express = require('express');
const router = express.Router();
const {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Tất cả các route users đều cần đăng nhập và quyền admin
router.use(protect);
router.use(adminOnly);

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
