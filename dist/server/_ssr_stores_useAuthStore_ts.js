"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_stores_useAuthStore_ts";
exports.ids = ["_ssr_stores_useAuthStore_ts"];
exports.modules = {

/***/ "(ssr)/./stores/useAuthStore.ts":
/*!********************************!*\
  !*** ./stores/useAuthStore.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   useAuthStore: () => (/* binding */ useAuthStore)\n/* harmony export */ });\n/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zustand */ \"(ssr)/./node_modules/zustand/esm/react.mjs\");\n\nconst useAuthStore = (0,zustand__WEBPACK_IMPORTED_MODULE_0__.create)((set)=>({\n        userDetail: undefined,\n        accessToken: null,\n        refreshToken: null,\n        setAccessToken: (accessToken)=>set({\n                accessToken\n            }),\n        setRefreshToken: (refreshToken)=>set({\n                refreshToken\n            }),\n        setAccessAndRefreshToken: (data)=>set({\n                accessToken: data.accessToken,\n                refreshToken: data.refreshToken\n            }),\n        setUserDetail: (userDetail)=>set({\n                userDetail\n            })\n    }));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9zdG9yZXMvdXNlQXV0aFN0b3JlLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBRWdDO0FBWXpCLE1BQU1DLGVBQWVELCtDQUFNQSxDQUFZLENBQUNFLE1BQVM7UUFDdERDLFlBQVlDO1FBQ1pDLGFBQWE7UUFDYkMsY0FBYztRQUNkQyxnQkFBZ0IsQ0FBQ0YsY0FBZ0JILElBQUk7Z0JBQUVHO1lBQVk7UUFDbkRHLGlCQUFpQixDQUFDRixlQUFpQkosSUFBSTtnQkFBRUk7WUFBYTtRQUN0REcsMEJBQTBCLENBQUNDLE9BQ3pCUixJQUFJO2dCQUFFRyxhQUFhSyxLQUFLTCxXQUFXO2dCQUFFQyxjQUFjSSxLQUFLSixZQUFZO1lBQUM7UUFDdkVLLGVBQWUsQ0FBQ1IsYUFBMEJELElBQUk7Z0JBQUVDO1lBQVc7SUFDN0QsSUFBRyIsInNvdXJjZXMiOlsiRTpcXEphdmEgNVxcZWNsaXBzZS13b3Jrc3BhY2VcXGFncmlzaHJpbXAtZmUtcmVhY3RcXHN0b3Jlc1xcdXNlQXV0aFN0b3JlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dGhSZXNwb25zZSB9IGZyb20gJ0AvYXBwL3R5cGVzL2F1dGguc2NoZW1hJ1xyXG5pbXBvcnQgeyBVc2VyVHlwZSB9IGZyb20gJ0AvYXBwL3R5cGVzL3VzZXIuc2NoZW1hJ1xyXG5pbXBvcnQgeyBjcmVhdGUgfSBmcm9tICd6dXN0YW5kJ1xyXG5cclxuaW50ZXJmYWNlIEF1dGhTdG9yZSB7XHJcbiAgdXNlckRldGFpbD86IFVzZXJUeXBlXHJcbiAgYWNjZXNzVG9rZW46IHN0cmluZyB8IG51bGxcclxuICByZWZyZXNoVG9rZW4/OiBzdHJpbmcgfCBudWxsXHJcbiAgc2V0QWNjZXNzVG9rZW46ICh0b2tlbjogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZFxyXG4gIHNldFJlZnJlc2hUb2tlbjogKHRva2VuOiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkXHJcbiAgc2V0QWNjZXNzQW5kUmVmcmVzaFRva2VuOiAoZGF0YTogQXV0aFJlc3BvbnNlKSA9PiB2b2lkXHJcbiAgc2V0VXNlckRldGFpbDogKHVzZXJEZXRhaWxzPzogVXNlclR5cGUpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHVzZUF1dGhTdG9yZSA9IGNyZWF0ZTxBdXRoU3RvcmU+KChzZXQpID0+ICh7XHJcbiAgdXNlckRldGFpbDogdW5kZWZpbmVkLFxyXG4gIGFjY2Vzc1Rva2VuOiBudWxsLFxyXG4gIHJlZnJlc2hUb2tlbjogbnVsbCxcclxuICBzZXRBY2Nlc3NUb2tlbjogKGFjY2Vzc1Rva2VuKSA9PiBzZXQoeyBhY2Nlc3NUb2tlbiB9KSxcclxuICBzZXRSZWZyZXNoVG9rZW46IChyZWZyZXNoVG9rZW4pID0+IHNldCh7IHJlZnJlc2hUb2tlbiB9KSxcclxuICBzZXRBY2Nlc3NBbmRSZWZyZXNoVG9rZW46IChkYXRhOiBBdXRoUmVzcG9uc2UpID0+XHJcbiAgICBzZXQoeyBhY2Nlc3NUb2tlbjogZGF0YS5hY2Nlc3NUb2tlbiwgcmVmcmVzaFRva2VuOiBkYXRhLnJlZnJlc2hUb2tlbiB9KSxcclxuICBzZXRVc2VyRGV0YWlsOiAodXNlckRldGFpbD86IFVzZXJUeXBlKSA9PiBzZXQoeyB1c2VyRGV0YWlsIH0pXHJcbn0pKVxyXG4iXSwibmFtZXMiOlsiY3JlYXRlIiwidXNlQXV0aFN0b3JlIiwic2V0IiwidXNlckRldGFpbCIsInVuZGVmaW5lZCIsImFjY2Vzc1Rva2VuIiwicmVmcmVzaFRva2VuIiwic2V0QWNjZXNzVG9rZW4iLCJzZXRSZWZyZXNoVG9rZW4iLCJzZXRBY2Nlc3NBbmRSZWZyZXNoVG9rZW4iLCJkYXRhIiwic2V0VXNlckRldGFpbCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./stores/useAuthStore.ts\n");

/***/ })

};
;