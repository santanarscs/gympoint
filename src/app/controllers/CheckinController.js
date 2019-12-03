// import * as Yup from 'yup';
import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import Checkin from '../models/Checkin';

class CheckinController {
  async index(req, res) {
    const checkins = await Checkin.findAll();
    return res.json(checkins);
  }

  async store(req, res) {
    const { id: student_id } = req.params;

    // verificar quantidade de checkins

    const limitDay = subDays(new Date(), 7);
    const checkins = await Checkin.findAll({
      where: {
        student_id,
        created_at: {
          [Op.between]: [limitDay, new Date()],
        },
      },
    });
    if (checkins.length >= 5) {
      return res.status(400).json({ error: 'Max limit days' });
    }

    const checkin = await Checkin.create({ student_id });
    return res.json(checkin);
  }
}

export default new CheckinController();
