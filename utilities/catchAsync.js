// created to avoid writing try catch blocks to handle errors. This is a cleaner way to handle errors
module.exports = func => {
    return (req, res, next) => {
        func (req, res, next).catch(next);
    }
}