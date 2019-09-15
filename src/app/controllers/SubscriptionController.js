import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';
import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async store(req, res) {
    const user_id = req.userId;
    const { meetup_id } = req.body;
    const meetup = await Meetup.findByPk(meetup_id, { include: [User] });
    const user = await User.findByPk(req.userId);
    if (!meetup) {
      return res.status(400).json({ error: 'Meetup does not exists.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "Can't subscription in past meetups." });
    }

    const checkDate = await Subscription.findOne({
      where: { user_id },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time." });
    }

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });
    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });
    return res.json(subscription);
  }

  async index(req, res) {
    const user_id = req.userId;

    const subscriptions = await Subscription.findAll({
      where: { user_id },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }
}

export default new SubscriptionController();
