import { Package, Subject, Subscription } from "../../models/index.js";
import { ApiError, pageMeta, paginate } from "../../utils/index.js";

const isAdmin = (requester) => requester?.role === "admin";

const findPackage = async (id) => {
  const pkg = await Package.findById(id);
  if (!pkg) throw new ApiError(404, "Package not found");
  return pkg;
};

// Subjects must all exist; the caller's order is kept.
const assertSubjectsExist = async (subjectIds) => {
  const found = await Subject.find({ _id: { $in: subjectIds } }).select("name");
  if (found.length !== subjectIds.length) {
    throw new ApiError(404, "One or more subjects were not found");
  }
  return new Map(found.map((subject) => [String(subject._id), subject.name]));
};

const present = (pkg, names) => ({
  _id: pkg._id,
  name: pkg.name,
  description: pkg.description,
  price: pkg.price,
  durationDays: pkg.durationDays,
  status: pkg.status,
  subjects: pkg.subjectIds.map((id) => ({ _id: id, name: names.get(String(id)) ?? null })),
  created_at: pkg.created_at,
});

const withNames = async (packages) => {
  const ids = packages.flatMap((pkg) => pkg.subjectIds);
  const subjects = await Subject.find({ _id: { $in: ids } }).select("name");
  const names = new Map(subjects.map((subject) => [String(subject._id), subject.name]));
  return packages.map((pkg) => present(pkg, names));
};

const listPackages = async (requester, query) => {
  const filter = {};
  if (!isAdmin(requester)) filter.status = "published";
  else if (query.status) filter.status = query.status;

  const { page, limit, skip } = paginate(query);
  const [total, packages] = await Promise.all([
    Package.countDocuments(filter),
    Package.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
  ]);

  return { packages: await withNames(packages), pagination: pageMeta(page, limit, total) };
};

const getPackage = async (requester, id) => {
  const pkg = await findPackage(id);
  if (!isAdmin(requester) && pkg.status !== "published") {
    throw new ApiError(404, "Package not found");
  }
  const [presented] = await withNames([pkg]);
  return presented;
};

const createPackage = async (data) => {
  await assertSubjectsExist(data.subjectIds);
  const pkg = await Package.create({
    name: data.name,
    description: data.description,
    price: data.price,
    durationDays: data.durationDays,
    subjectIds: data.subjectIds,
    status: data.status ?? "published",
  });
  const [presented] = await withNames([pkg]);
  return presented;
};

const updatePackage = async (id, data) => {
  const pkg = await findPackage(id);
  if (data.subjectIds) await assertSubjectsExist(data.subjectIds);

  for (const field of ["name", "description", "price", "durationDays", "subjectIds", "status"]) {
    if (data[field] !== undefined) pkg[field] = data[field];
  }
  await pkg.save();
  const [presented] = await withNames([pkg]);
  return presented;
};

const deletePackage = async (id) => {
  const pkg = await findPackage(id);
  if (await Subscription.exists({ packageId: id, status: "active" })) {
    throw new ApiError(409, "Package has active subscriptions and cannot be deleted");
  }
  await pkg.deleteOne();
};

export { listPackages, getPackage, createPackage, updatePackage, deletePackage };
