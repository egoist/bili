export default async function () {
  return {
    ...(await this.bar())
  }
}
