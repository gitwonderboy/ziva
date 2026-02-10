const BASE_URL = 'https://a4sklso1b4.execute-api.af-south-1.amazonaws.com/prod';

export const fetchDashboardData = async (userEmail) => {
  if (!userEmail) return null;
  const response = await fetch(`${BASE_URL}/partner/stats?email=${encodeURIComponent(userEmail)}`);
  if (!response.ok) throw new Error('Network response was not ok');

  const data = await response.json();

  return {
    summary: {
      total: data.total_documents,
      processed: data.stats.PROCESSED || 0,
      failed: data.stats.MANUAL_REVIEW_REQUIRED || 0,
      successRate: data.total_documents > 0 ? ((data.stats.PROCESSED / data.total_documents) * 100).toFixed(1) : 0,
    },
    documents: data.records.map((rec) => ({
      id: rec.message_id,
      fileName: rec.s3_path.split('/').pop(),
      tenant: rec.tenant_id,
      address: rec.doc_address,
      status: rec.status === 'PROCESSED' ? 'SUCCESS' : 'FAILED',
      amount: rec.doc_total,
      receivedAt: rec.received_at,
      accNo: rec.doc_acc_no,
      date: rec.doc_date,
      isUnreadable: rec.doc_address === 'UNREADABLE' || rec.doc_date === 'UNREADABLE',
    })),
    chartData: processMonthlyStats(data.records),
  };
};

export const scanInbox = async (userEmail) => {
  const response = await fetch(`${BASE_URL}/admin/scan?email=${encodeURIComponent(userEmail)}`);
  if (!response.ok) throw new Error('Failed to sync inbox');
  return response.json();
};

const processMonthlyStats = (records) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts = {};
  records.forEach((rec) => {
    const monthIndex = new Date(rec.received_at).getMonth();
    const monthName = months[monthIndex];
    counts[monthName] = (counts[monthName] || 0) + 1;
  });
  return Object.keys(counts).map((name) => ({ name, count: counts[name] }));
};
