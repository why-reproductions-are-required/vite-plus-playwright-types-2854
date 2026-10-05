export const hooks = {
  readPackage(pkg) {
    if (pkg.name === "vite-plus") {
      pkg.peerDependencies = { ...pkg.peerDependencies, playwright: "*" };
      pkg.peerDependenciesMeta = {
        ...pkg.peerDependenciesMeta,
        playwright: { optional: true },
      };
    }
    return pkg;
  },
};
