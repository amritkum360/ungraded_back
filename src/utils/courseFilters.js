function isFreeCourse(course) {
  const label = String(course.priceLabel || course.price || "").trim().toLowerCase();
  return label === "free" || label === "₹0" || label === "0";
}

export function matchesCourseFilter(course, filter) {
  if (!filter || filter.filterType === "all") return true;

  switch (filter.filterType) {
    case "status":
      return (
        String(course.status || "").toLowerCase() ===
        String(filter.value || "").toLowerCase()
      );
    case "category":
      return (
        String(course.category || "").toLowerCase() ===
        String(filter.value || "").toLowerCase()
      );
    case "type":
      return (
        String(course.type || "").toLowerCase() ===
        String(filter.value || "").toLowerCase()
      );
    case "language":
      return (
        String(course.language || "").toLowerCase() ===
        String(filter.value || "").toLowerCase()
      );
    case "priceFree":
      return isFreeCourse(course);
    case "pricePaid":
      return !isFreeCourse(course);
    default:
      return true;
  }
}

export function searchCourses(courses, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return courses;

  return courses.filter((course) => {
    const haystack = [
      course.headerTitle,
      course.title,
      course.teacherName,
      course.category,
      course.type,
      course.language,
      course.startsOn,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterCourses(courses, filter, query) {
  const searched = searchCourses(courses, query);
  if (!filter || filter.filterType === "all") return searched;
  return searched.filter((course) => matchesCourseFilter(course, filter));
}
