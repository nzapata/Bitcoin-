exports.get = (req, res) => {
  const config = req.app.get('config');
  return res.status(200).send({
    ...config.server,
  });
};
