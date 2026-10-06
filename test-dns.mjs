import dns from 'dns';
const { Resolver } = dns.promises;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']); // Use Google DNS
resolver.resolve4('s3-id-jkt-1.kilatstorage.id').then(addresses => {
  console.log("Resolved with 8.8.8.8:", addresses);
}).catch(err => {
  console.error("Failed with 8.8.8.8:", err);
});
