// Generates a donor ID based on the organization initials and donation type
// Format: [ORG_INITIALS][DONATION_TYPE][INCREMENTAL_NUMBER]
// Example: SSOTD000000001 (One-time donation)
// Example: SSMD000000001 (Monthly donation)

const ORG_INITIALS = 'SS';
const ID_LENGTH = 12; // Total length of the ID
const PADDING_CHAR = '0';

const DONATION_TYPE_MAP = {
  'one-time': 'OTD',
  'monthly': 'MD'
};

export const generateDonorId = (donationType, sequenceNumber) => {
  // Get the type code (default to OTD if type is not recognized)
  const typeCode = DONATION_TYPE_MAP[donationType.toLowerCase()] || 'OTD';
  
  // Calculate the number of digits needed for the sequence
  const prefix = `${ORG_INITIALS}${typeCode}`;
  const digitsNeeded = ID_LENGTH - prefix.length;
  
  // Ensure the sequence number is a positive integer
  const sequence = Math.max(1, parseInt(sequenceNumber) || 1);
  
  // Format the sequence number with leading zeros
  const paddedSequence = String(sequence).padStart(digitsNeeded, PADDING_CHAR);
  
  return `${prefix}${paddedSequence}`;
};

// Extracts the sequence number from a donor ID
export const getSequenceFromDonorId = (donorId) => {
  if (!donorId) return 1;
  // Extract the numeric part at the end of the ID
  const match = donorId.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 1;
};

// Gets the next sequence number for a donation type
export const getNextSequenceNumber = async (donationType) => {
  try {
    // Get the highest existing sequence number for this donation type
    const response = await donationsAPI.getDonations({
      type: donationType,
      sort: '-donorId',
      limit: 1
    });
    
    if (response.data.data && response.data.data.length > 0) {
      const lastDonorId = response.data.data[0].donorId || '';
      return getSequenceFromDonorId(lastDonorId) + 1;
    }
    return 1; // Start from 1 if no donations exist yet
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    return 1; // Fallback to 1 on error
  }
};
