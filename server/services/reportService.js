const mongoose = require('mongoose');
const Donation = require('../models/Donation');

async function donationSummaryByMonth({ organization, dateFrom, dateTo, campaignId, donor }) {
  const match = {};
  if (organization) match.organization = new mongoose.Types.ObjectId(organization);
  if (campaignId) match.campaign = new mongoose.Types.ObjectId(campaignId);
  if (donor) match.donor = new mongoose.Types.ObjectId(donor);
  if (dateFrom || dateTo) {
    match.donationDate = {};
    if (dateFrom) match.donationDate.$gte = new Date(dateFrom);
    if (dateTo) match.donationDate.$lte = new Date(dateTo);
  }
  match.status = 'completed';

  const pipeline = [
    { $match: match },
    { $group: {
        _id: { year: { $year: '$donationDate' }, month: { $month: '$donationDate' } },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        totalAmount: 1,
        count: 1,
      }
    }
  ];
  return Donation.aggregate(pipeline);
}

async function donorDemographics({ organization, dateFrom, dateTo, donor }) {
  const match = {};
  if (organization) match.organization = new mongoose.Types.ObjectId(organization);
  if (donor) match.donor = new mongoose.Types.ObjectId(donor);
  if (dateFrom || dateTo) {
    match.donationDate = {};
    if (dateFrom) match.donationDate.$gte = new Date(dateFrom);
    if (dateTo) match.donationDate.$lte = new Date(dateTo);
  }
  match.status = 'completed';

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'contacts', localField: 'donor', foreignField: '_id', as: 'donor' } },
    { $unwind: '$donor' },
    { $group: {
        _id: '$donor.city',
        donors: { $addToSet: '$donor._id' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      }
    },
    { $project: {
        city: '$_id',
        _id: 0,
        donorCount: { $size: '$donors' },
        totalAmount: 1,
        count: 1,
      }
    },
    { $sort: { totalAmount: -1 } }
  ];
  return Donation.aggregate(pipeline);
}

async function campaignPerformance({ organization, dateFrom, dateTo, donor }) {
  const match = {};
  if (organization) match.organization = new mongoose.Types.ObjectId(organization);
  if (donor) match.donor = new mongoose.Types.ObjectId(donor);
  if (dateFrom || dateTo) {
    match.donationDate = {};
    if (dateFrom) match.donationDate.$gte = new Date(dateFrom);
    if (dateTo) match.donationDate.$lte = new Date(dateTo);
  }
  match.status = 'completed';

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'campaign' } },
    { $unwind: { path: '$campaign', preserveNullAndEmptyArrays: true } },
    { $group: {
        _id: '$campaign._id',
        campaignName: { $first: '$campaign.name' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      }
    },
    { $project: {
        _id: 0,
        campaignId: '$_id',
        campaignName: { $ifNull: ['$campaignName', 'Unattributed'] },
        totalAmount: 1,
        count: 1,
      }
    },
    { $sort: { totalAmount: -1 } }
  ];
  return Donation.aggregate(pipeline);
}

const queryMap = {
  donation_summary_by_month: donationSummaryByMonth,
  donor_demographics: donorDemographics,
  campaign_performance: campaignPerformance,
};

async function runQuery(queryKey, params) {
  const fn = queryMap[queryKey];
  if (!fn) throw new Error('Unknown queryKey');
  return fn(params || {});
}

module.exports = {
  donationSummaryByMonth,
  donorDemographics,
  campaignPerformance,
  runQuery,
};
