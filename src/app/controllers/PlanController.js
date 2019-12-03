import * as Yup from 'yup';
import Plan from '../models/Plan';

class PlanController {
  async index(req, res) {
    const plans = await Plan.findAll();
    return res.json(plans);
  }

  async find(req, res) {
    const plan = await Plan.findByPk(req.params.id);
    return res.json(plan);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { title } = req.body;

    const checkPlan = await Plan.findOne({ where: { title } });
    if (checkPlan) {
      res.status(400).json({ error: 'Plan already exist ' });
    }

    const plan = await Plan.create(req.body);
    return res.json(plan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { title } = req.body;
    const { id } = req.params;
    const plan = Plan.findByPk(id);

    if (title !== plan.title) {
      const planExist = await Plan.findOne({ where: { title } });

      if (planExist) {
        return res.status(400).json({ error: 'Plan already exist' });
      }
    }
    const updatedPlan = await plan.update(req.body);
    return res.json(updatedPlan);
  }

  async delete(req, res) {
    await Plan.destroy(req.params.id);
    return res.status(200);
  }
}

export default new PlanController();
