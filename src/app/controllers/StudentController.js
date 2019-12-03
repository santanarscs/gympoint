import * as Yup from 'yup';
import Student from '../models/Student';

class StudentController {
  async index(req, res) {
    const students = await Student.findAll();
    return res.json(students);
  }

  async find(req, res) {
    const student = await Student.findByPk(req.params.id);
    return res.json(student);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number().required(),
      weight: Yup.number().required(),
      height: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { email } = req.body;

    const checkStudent = await Student.findOne({ where: { email } });
    if (checkStudent) {
      res.status(400).json({ error: 'Student already exist ' });
    }

    const student = await Student.create(req.body);
    return res.json(student);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      age: Yup.number(),
      weight: Yup.number(),
      height: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { email } = req.body;
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (email && email !== student.email) {
      const studentExist = await Student.findOne({ where: { email } });

      if (studentExist) {
        return res.status(400).json({ error: 'Student already exist' });
      }
    }
    const updatedStudent = await student.update(req.body);
    return res.json(updatedStudent);
  }

  async delete(req, res) {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    await student.destroy();
    return res.status(200).json();
  }
}
export default new StudentController();
