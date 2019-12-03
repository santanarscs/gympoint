import Mail from '../../lib/Mail';

class WelcomeMail {
  get key() {
    return 'WelcomeMail';
  }

  async handle({ data }) {
    const { name, email, start_date, registrationEnd, plan } = data;
    await Mail.sendMail({
      to: `${name} <${email}>`,
      subject: 'Novo registro',
      template: 'welcome',
      context: {
        name,
        title: plan.title,
        start_date,
        end_date: registrationEnd,
        price: plan.price * plan.duration,
      },
    });
  }
}

export default new WelcomeMail();
