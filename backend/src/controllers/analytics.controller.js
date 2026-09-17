import { Order } from "../models/order.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";

export const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // 1. Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Start of This Month & Last Month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 3. Overall Totals
    const [overallStats] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalDiscount: { $sum: { $ifNull: ["$discountAmount", 0] } },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = overallStats?.totalRevenue || 0;
    const totalDiscount = overallStats?.totalDiscount || 0;
    const totalOrders = overallStats?.totalOrders || 0;

    // 4. Students & Courses Counts
    const totalStudents = await User.countDocuments({ role: { $ne: "admin" } });
    const totalCourses = await Course.countDocuments();

    // 5. Today's Sales
    const [todayStats] = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$totalAmount" },
          todayOrders: { $sum: 1 },
        },
      },
    ]);
    const todayRevenue = todayStats?.todayRevenue || 0;
    const todayOrders = todayStats?.todayOrders || 0;

    // 6. This Month vs Last Month
    const [thisMonthStats] = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth } } },
      {
        $group: {
          _id: null,
          thisMonthRevenue: { $sum: "$totalAmount" },
          thisMonthOrders: { $sum: 1 },
        },
      },
    ]);
    const thisMonthRevenue = thisMonthStats?.thisMonthRevenue || 0;
    const thisMonthOrders = thisMonthStats?.thisMonthOrders || 0;

    const [lastMonthStats] = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          lastMonthRevenue: { $sum: "$totalAmount" },
          lastMonthOrders: { $sum: 1 },
        },
      },
    ]);
    const lastMonthRevenue = lastMonthStats?.lastMonthRevenue || 0;

    let growthPercentage = 0;
    if (lastMonthRevenue === 0) {
      growthPercentage = thisMonthRevenue > 0 ? 100 : 0;
    } else {
      growthPercentage = Math.round(
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      );
    }

    // 7. Monthly Revenue Trend (Last 6 Months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build standard 6-month array ensuring no gaps
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      const found = monthlyAgg.find(
        (item) => item._id.year === y && item._id.month === m
      );
      monthlyData.push({
        label: `${monthNames[m - 1]} ${y}`,
        shortLabel: monthNames[m - 1],
        year: y,
        month: m,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      });
    }

    // 8. Daily Revenue Trend (Last 7 Days)
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const dailyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]);

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const found = dailyAgg.find(
        (item) =>
          item._id.year === y &&
          item._id.month === m &&
          item._id.day === day
      );
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      dailyData.push({
        label: `${dayName}, ${day} ${monthNames[m - 1]}`,
        shortLabel: `${day} ${monthNames[m - 1]}`,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      });
    }

    // 9. Category Breakdown (Courses vs Exams)
    const categoryAgg = await Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$orderType", "course"] },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]);

    let courseRevenue = 0;
    let courseOrders = 0;
    let examRevenue = 0;
    let examOrders = 0;

    categoryAgg.forEach((cat) => {
      if (cat._id === "exam") {
        examRevenue = cat.revenue;
        examOrders = cat.orders;
      } else {
        courseRevenue += cat.revenue;
        courseOrders += cat.orders;
      }
    });

    // 10. Top Performing Courses
    const topCoursesAgg = await Order.aggregate([
      { $match: { course: { $ne: null } } },
      {
        $group: {
          _id: "$course",
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1, orderCount: -1 } },
      { $limit: 25 },
    ]);

    // Populate course details
    const topCourseIds = topCoursesAgg.map((c) => c._id);
    const populatedCourses = await Course.find({ _id: { $in: topCourseIds } }).select(
      "title thumbnail amount courseType"
    );

    const topCourses = topCoursesAgg.map((item) => {
      const courseInfo = populatedCourses.find(
        (c) => c._id.toString() === item._id.toString()
      );
      return {
        _id: item._id,
        title: courseInfo?.title || "Untitled Course",
        thumbnail: courseInfo?.thumbnail || "",
        courseType: courseInfo?.courseType || "video",
        totalRevenue: item.totalRevenue,
        orderCount: item.orderCount,
      };
    });

    // 11. Recent 50 Transactions
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name email mobileNo")
      .populate("course", "title thumbnail")
      .populate("exam", "title")
      .lean();

    const formattedRecentOrders = recentOrders.map((order) => {
      let itemName = "Course Purchase";
      if (order.course?.title) {
        itemName = order.course.title;
      } else if (order.exam?.title) {
        itemName = order.exam.title;
      }

      return {
        _id: order._id,
        orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
        user: {
          name: order.user?.name || "Student",
          email: order.user?.email || "N/A",
          mobileNo: order.user?.mobileNo || "N/A",
        },
        itemName,
        orderType: order.orderType || "course",
        totalAmount: order.totalAmount,
        originalAmount: order.originalAmount || order.totalAmount,
        discountAmount: order.discountAmount || 0,
        couponCode: order.couponCode || null,
        planDuration: order.planDuration || null,
        paymentGateway: order.paymentGateway || "cashfree",
        createdAt: order.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          totalStudents,
          totalCourses,
          totalDiscount,
          todayRevenue,
          todayOrders,
          thisMonthRevenue,
          thisMonthOrders,
          growthPercentage,
        },
        monthlyData,
        dailyData,
        categoryBreakdown: {
          course: { revenue: courseRevenue, orders: courseOrders },
          exam: { revenue: examRevenue, orders: examOrders },
        },
        topCourses,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error) {
    console.error("Error in getAdminAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching analytics data",
      error: error.message,
    });
  }
};
