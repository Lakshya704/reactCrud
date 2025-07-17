const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const path = require("path");

// image upload setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).single("image");

// Insert user into DB
router.post("/add", upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });

        await user.save(); // await instead of callback

        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

// Render home page and show users
router.get("/", async (req, res) => {
    try {
        const users = await User.find(); // async/await for querying
        res.render("index", {
            title: "Payplex",
            users: users,
            message: req.session.message,
        });
        req.session.message = null;
    } catch (err) {
        res.json({ message: err.message });
    }
});

// Render add user page
router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users" });
});

module.exports = router;

//update page
// Render the update form with pre-filled user data
router.get("/edit/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.redirect("/");
        }
        res.render("edit_users", {
            title: "Update User",
            user: user,
        });
    } catch (err) {
        res.redirect("/");
    }
});

// Handle update form submission
router.post("/update/:id", upload, async (req, res) => {
    let user;
    try {
        user = await User.findById(req.params.id);

        // Check if a new image is uploaded
        let newImage = user.image;
        if (req.file) {
            newImage = req.file.filename;
        }

        await User.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: newImage,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully',
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});


const fs = require("fs"); // at top if not already added

router.get("/delete/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (user && user.image) {
      const filePath = `./uploads/${user.image}`;
      fs.unlink(filePath, (err) => {
        if (err) console.log("Image not deleted:", err.message);
      });
    }

    req.session.message = {
      type: 'success',
      message: 'User deleted successfully',
    };
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting user");
  }
});
router.get("/delete-confirm/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.render("confirm_delete", { user: user });
    } catch (err) {
        res.redirect("/");
    }
});
