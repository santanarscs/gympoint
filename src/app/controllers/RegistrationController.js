import * as Yup from 'yup';
import { Op } from 'sequelize';
import { parseISO, isBefore, addMonths } from 'date-fns';

import WelcomeMaill from '../jobs/WelcomeMail';
import Queue from '../../lib/Queue';

import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      order: ['start_date'],
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });
    res.status(200).json(registrations);
  }

  async find(req, res) {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      res.status(400).json({ error: 'Registration not found' });
    }
    res.status(200).json(registration);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { student_id, plan_id, start_date } = req.body;

    const registrationExist = await Registration.findOne({
      where: {
        student_id,
        end_date: {
          [Op.gt]: parseISO(start_date),
        },
      },
    });
    if (registrationExist) {
      return res.status(400).json({ error: 'Student already has active plan' });
    }

    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    if (isBefore(parseISO(start_date), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }
    const end_date = addMonths(parseISO(start_date), plan.duration);
    const price = plan.price * plan.duration;

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    const { name, email } = await Student.findByPk(student_id);
    await Queue.add(WelcomeMaill.key, {
      name,
      email,
      start_date,
      end_date,
      plan,
    });
    return res.json(registration);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params.id;
    const { student_id, plan_id, start_date } = req.body;
    const registration = await Registration.findByPk(id);
    const plan = Plan.findByPk(plan_id);
    if (!registration) {
      res.status(400).json({ error: 'Registration not found' });
    }
    if (!plan) {
      res.status(400).json({ error: 'Plan not found' });
    }

    if (student_id && student_id !== registration.student_id) {
      const registrationExist = await Registration.findOne({
        where: {
          student_id,
          end_date: {
            [Op.gt]: parseISO(start_date),
          },
        },
      });

      if (registrationExist) {
        return res
          .status(400)
          .json({ error: 'Registration already exist and have active plan' });
      }
    }
    const end_date = addMonths(parseISO(start_date), plan.duration);

    const price = plan.price * plan.duration;

    const updatedRegistration = await registration.update({
      ...req.body,
      end_date,
      price,
    });
    return res.json(updatedRegistration);
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      return res.status(400).json({ error: 'Registration not found' });
    }
    await registration.destroy();
    return res.status(200).json();
  }
}

export default new RegistrationController();
