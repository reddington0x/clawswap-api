module.exports = (req, res) => {
  const { id } = req.query;
  
  res.json({
    swapId: id,
    explorerUrl: `https://explorer.mayan.finance/swap/${id}`,
    message: 'Track your swap on Mayan Explorer'
  });
};
