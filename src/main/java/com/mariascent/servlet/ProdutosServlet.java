package com.mariascent.servlet;

import com.mariascent.dao.produtoDAO;
import com.mariascent.model.produto;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/produtos")
public class ProdutosServlet extends HttpServlet {
    private produtoDAO produtoDAO = new produtoDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        List<produto> produtos = produtoDAO.listarProdutos();

String json = new Gson().toJson(produtos);


        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }
}
