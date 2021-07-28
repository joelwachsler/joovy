
const main = async () => {
  console.log('called')
}

if (require.main === module) {
  main()
}
