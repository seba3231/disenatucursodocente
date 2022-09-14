
let express = require("express");
let appp = express();
let fs = require("fs");
appp.use(express.json());

const cors = require("cors");
const { arch } = require("os");
const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
appp.use(cors(corsOptions));

appp.post("/cursos", function (req, res) {
  fs.writeFile(
    __dirname + "/src/assets/schemasData/" + `curso_${req.body.curso.id}.json`,
    JSON.stringify(req.body.curso),
    (err) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        res.status(201).send();
      }
    }
  );
});

appp.get("/cursos/:id", function (req, res) {
  const { id } = req.params;
  fs.readFile(
    __dirname + "/src/assets/schemasData/" + `curso_${id}.json`,
    "utf8",
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        const json = JSON.parse(data);
        res.status(200).send(json);
      }
    }
  );
});

appp.get("/cursos", function (req, res) {
  const cursos = [];
  fs.readdir(__dirname + "/src/assets/schemasData", (err, archivoCursos) => {
    if (err) console.log(err);
    archivoCursos.forEach((archivoCurso, i) =>
      fs.readFile(
        __dirname + "/src/assets/schemasData/" + `${archivoCurso}`,
        "utf8",
        (err, data) => {
          if (err) {
            console.log(err);
            res.status(400).send(err);
          } else {
            const json = JSON.parse(data);
            cursos.push(json);
          }
        }
      )
    );
  });
  setTimeout(() => res.status(200).send(cursos), 100);
});

appp.put("/cursos/:id", function (req, res) {
  const { id } = req.params;
  const cursoActualizado = req.body.curso;
  fs.writeFile(
    __dirname + "/src/assets/schemasData/" + `curso_${id}.json`,
    JSON.stringify(cursoActualizado),
    (err) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        res.status(200).send();
      }
    }
  );
});

let server = appp.listen(8081, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
});
