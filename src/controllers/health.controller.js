export const health = async (req, res) => {
  return res.status(200).json({
    message: "API is healthy",
  });
};
