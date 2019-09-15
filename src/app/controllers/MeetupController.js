import * as Yup from 'yup';

import {
  isBefore,
  startOfHour,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';

import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      file_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { date } = req.body;
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }
    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });
    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      file_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { date } = req.body;
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not find.' });
    }
    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not permitted.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Past meetup are not permitted edit.' });
    }
    await meetup.update(req.body);
    return res.json(meetup);
  }

  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    where.user_id = req.userId;
    const meetups = await Meetup.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async delete(req, res) {
    const user_id = req.userId;

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== user_id) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't delete past meetups." });
    }

    await meetup.destroy();

    return res.send();
  }
}
export default new MeetupController();
